"use client";

import React from "react";

export function LiquidGlassFilter({ id, targetId, blur = 12 }: { id: string; targetId?: string; blur?: number }) {
  const eventTarget = targetId || id;
  
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <filter id={id} filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
        <feImage 
          href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iZ3JhZCIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzgwODA4MCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI4NSUiIHN0b3AtY29sb3I9IiM4MDgwODAiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iOTUlIiBzdG9wLWNvbG9yPSIjZmZmIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMDAiIC8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPgo8L3N2Zz4=" 
          result="img"
          preserveAspectRatio="none"
          width="100%" height="100%"
        />
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur * 0.5} result="blur" />
        <feDisplacementMap id={`disp-${id}`} in="blur" in2="img" scale="90" xChannelSelector="R" yChannelSelector="G">
          {/* Apply animations based on mouseover and mouseout of the target id */}
          <animate attributeName="scale" to="200" dur="0.4s" begin={`${eventTarget}.mouseover`} fill="freeze" />
          <animate attributeName="scale" to="90" dur="0.4s" begin={`${eventTarget}.mouseout`} fill="freeze" />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}
