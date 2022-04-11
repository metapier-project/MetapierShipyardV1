import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"

transaction(
    poolId: String,
    price: UFix64?,
    personalCap: UFix64?,
    totalCap: UFix64?,
    fundingStartTime: UFix64?,
    fundingEndTime: UFix64?,
    claimingStartTime: UFix64?,
    fundsDepositOnlyPeriod: UFix64?,
    addWhitelists: [Address],
    removeWhitelists: [Address]
) {

    let adminRef: &MetapierLaunchpad.Admin

    prepare(launchpadOwner: AuthAccount) {
        self.adminRef = launchpadOwner.borrow<&MetapierLaunchpad.Admin>(from: /storage/MetapierLaunchpadAdmin)!
    }

    execute {
        if price != nil {
            self.adminRef.updatePrice(poolId: poolId, price: price!)
        }

        if personalCap != nil {
            self.adminRef.updatePersonalCap(poolId: poolId, personalCap: personalCap!)
        }

        if totalCap != nil {
            self.adminRef.updateTotalCap(poolId: poolId, totalCap: totalCap!)
        }

        if fundingStartTime != nil || fundingEndTime != nil || claimingStartTime != nil || fundsDepositOnlyPeriod != nil {
            self.adminRef.updateTimeline(
                poolId: poolId, 
                fundingStartTime: fundingStartTime, 
                fundingEndTime: fundingEndTime, 
                claimingStartTime: claimingStartTime,
                fundsDepositOnlyPeriod: fundsDepositOnlyPeriod
            )
        }

        if addWhitelists.length > 0 {
            self.adminRef.addWhitelist(poolId: poolId, addresses: addWhitelists)
        }

        if removeWhitelists.length > 0 {
            self.adminRef.removeWhitelist(poolId: poolId, addresses: removeWhitelists)
        }
    }
}
