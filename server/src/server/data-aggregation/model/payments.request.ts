export interface PaymentsRequest {
  chainName: string;
  address: string;
  currency: string;
  startDay: Date;
  endDay?: Date;
}
