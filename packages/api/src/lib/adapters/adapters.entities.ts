
export interface PaymentProvider {
  transfer: (amount: number, recipient: string) => Promise<void>;
  nameEnquiry: (props: { bankCode: string; accountNumber: string }) => Promise<Record<string, any>>;
  listBanks: () => Promise<Array<Record<string, any>>>;
  getTransaction: (id: string) => Promise<Record<string, any>>;
}
