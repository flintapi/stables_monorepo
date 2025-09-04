import type {
  OnRampFinalizeDto,
  OnRampInitDto,
} from "../entities/onramp.entity";

// onRamp service also collection and disbusment of cNGN stables
class OnRampService {
  private static instance: OnRampService;

  constructor() {
    // constructor logic
  }

  static getInstance(): OnRampService {
    if (!OnRampService.instance) {
      OnRampService.instance = new OnRampService();
    }
    return OnRampService.instance;
  }

  async init(dto: OnRampInitDto) {
    // create on ramp logic
    // return quote with fee pricing
  }

  async finalize(dto: OnRampFinalizeDto) {
    // create finalise ramp logic
    // return reference_id and hash to track transaction
  }

  private async getCollectionAccount() {
    // logic to get collection account with onbrails adapter
  }
}

export default OnRampService.getInstance();
