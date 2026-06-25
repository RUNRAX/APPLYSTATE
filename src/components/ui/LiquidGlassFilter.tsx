"use client";

import React from "react";

export function LiquidGlassFilter({ id, targetId, blur = 12 }: { id: string; targetId?: string; blur?: number }) {
  const eventTarget = targetId || id;
  
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <filter id={id} filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
        <feImage 
          href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iZ3JhZCIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZiIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDAwIiAvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkKSIgLz4KPC9zdmc+" 
          result="img"
          preserveAspectRatio="none"
          width="100%" height="100%"
        />
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur * 0.5} result="blur" />
        <feDisplacementMap id={`disp-${id}`} in="blur" in2="img" scale="20" xChannelSelector="R" yChannelSelector="G">
          {/* Apply animations based on mouseover and mouseout of the target id */}
          <animate attributeName="scale" to="50" dur="0.4s" begin={`${eventTarget}.mouseover`} fill="freeze" />
          <animate attributeName="scale" to="20" dur="0.4s" begin={`${eventTarget}.mouseout`} fill="freeze" />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}
