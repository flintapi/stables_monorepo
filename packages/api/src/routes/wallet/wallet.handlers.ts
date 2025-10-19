import { AppRouteHandler } from "@/lib/types";
import type {
  CreateWalletRequest,
  ListWalletRequest,
  GetOneWalletRequest,
  UpdateWalletRequest,
  WalletOperationRequest,
  WalletDataRequest,
} from "./wallet.routes";

export const create: AppRouteHandler<CreateWalletRequest> = async () => {};

export const list: AppRouteHandler<ListWalletRequest> = async () => {};

export const getOne: AppRouteHandler<GetOneWalletRequest> = async () => {};

export const update: AppRouteHandler<UpdateWalletRequest> = async () => {};

export const operation: AppRouteHandler<
  WalletOperationRequest
> = async () => {};

export const data: AppRouteHandler<WalletDataRequest> = async () => {};
