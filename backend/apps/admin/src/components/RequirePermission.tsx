"use client";

import React, { useEffect, useState } from "react";
import { hasAdminPermission } from "@/lib/admin-auth";

interface RequirePermissionProps {
  code: string | string[]; // Can be a single permission or an array (any of them will grant access)
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequirePermission({ code, children, fallback = null }: RequirePermissionProps) {
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (Array.isArray(code)) {
      setIsAllowed(code.some((c) => hasAdminPermission(c)));
    } else {
      setIsAllowed(hasAdminPermission(code));
    }
  }, [code]);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
