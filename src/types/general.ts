import { FC, PropsWithChildren } from "react";

export type FCC<T = object> = FC<PropsWithChildren<T>>;

export type ListC<T = object> = { items: T[] };

type ValueOf<T> = T[keyof T];
export type Entries<T> = [keyof T, ValueOf<T>][];
