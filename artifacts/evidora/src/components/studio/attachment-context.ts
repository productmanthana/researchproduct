import { createContext } from "react";

/** A composer must not send before its uploaded evidence is linked to the project. */
export const AttachmentBusyContext = createContext<((busy: boolean) => void) | null>(null);
