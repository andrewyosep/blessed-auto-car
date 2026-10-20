"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Car, type Settings, demoCars } from "@/lib/catalog";
import { renderShowroom } from "@/lib/showroom-view.mjs";
import { mountShowroom } from "@/lib/showroom-interactions.mjs";
export function Brand({settings}: {settings: Settings}) {
  return <a className="brand" href="/" aria-label={`${settings.name}, beranda`}>{settings.logo ? <img src={settings.logo} alt=""/> : <span className="brand-mark" aria-hidden="true">b<span>.</span></span>}<span className="brand-name">{settings.name}<small>Mobil bekas pilihan</small></span></a>;
}
export function Photo({src, alt, ...props}: {src: string; alt: string; className?: string; loading?: "lazy" | "eager"}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img {...props} src={failed ? "/car-placeholder.svg" : src} alt={alt} loading={props.loading || "lazy"} decoding="async" onError={() => setFailed(true)}/>;
}
export default function Showroom({cars, settings, storageError = false}: {cars: Car[]; settings: Settings; storageError?: boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const data = useMemo(() => ({ cars: cars.length ? cars : demoCars, settings, storageError }), [cars, settings, storageError]);
  const html = useMemo(() => renderShowroom(data), [data]);
  useEffect(() => root.current ? mountShowroom(root.current, data) : undefined, [data]);
  return <div ref={root} className="showroom" dangerouslySetInnerHTML={{__html: html}}/>;
}
