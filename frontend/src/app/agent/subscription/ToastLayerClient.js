"use client";

import { useMemo } from "react";
import ToastLayer from "../../../components/ToastLayer";

export default function ToastLayerClient({ toast }) {
  const items = useMemo(() => (toast ? [toast] : []), [toast]);
  return <ToastLayer items={items} />;
}
