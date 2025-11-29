import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ExternalLogin() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/login");
  }, [setLocation]);

  return null;
}
