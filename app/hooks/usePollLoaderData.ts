import { useEffect, useState } from "react";
import { useLoaderData, useRevalidator } from "react-router";

const useInterval = (callback: () => void, ms: number) => {
  useEffect(() => {
    const interval = setInterval(callback, ms);
    return () => {
      clearInterval(interval);
    };
  }, [callback, ms]);
};

export function usePollLoaderData<T>(ms: number) {
  const loaderData = useLoaderData<T>();
  const revalidator = useRevalidator();

  useInterval(() => {
    if (revalidator.state === "idle") {
      revalidator.revalidate();
    }
  }, ms);

  return loaderData;
}
