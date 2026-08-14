import type { Document } from "../domain/documento";

export type RankedClient = {
  name: string;
  maxOverdue: number;
  tiebreakerAmount: number;
  documents: Document[];
  grandTotal: number;
};