import { orgSchema } from "@flintapi/shared/Utils";

export const {
  wallet,
  transactions,
  walletRelations,
  insertWalletSchema,
  selectWalletSchema,
  updateWalletSchema,
  transactionRelations,
  patchTransactionSchema,
  insertTransactionSchema,
  selectTransactionSchema,
} = orgSchema;
