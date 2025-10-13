// onRamp service also collection and disbusment of cNGN stables
class OnRampService {
    static instance;
    constructor() {
        // constructor logic
    }
    static getInstance() {
        if (!OnRampService.instance) {
            OnRampService.instance = new OnRampService();
        }
        return OnRampService.instance;
    }
    async init(dto) {
        // create on ramp logic
        // return quote with fee pricing
    }
    async finalize(dto) {
        // create finalise ramp logic
        // return reference_id and hash to track transaction
    }
    async getCollectionAccount() {
        // logic to get collection account with onbrails adapter
    }
}
export default OnRampService.getInstance();
