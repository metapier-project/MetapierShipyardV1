import {{fundsToken}} from {{fundsTokenAddress}}
import {{launchToken}} from {{launchTokenAddress}}
import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"
import MetapierLaunchpadOwnerPass from "../../contracts/MetapierLaunchpadOwnerPass.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"

transaction(
    poolId: String,
    projectOwner: Address,
    price: UFix64,
    personalCap: UFix64,
    totalCap: UFix64,
    fundingStartTime: UFix64,
    fundingEndTime: UFix64,
    claimingStartTime: UFix64,
    fundsDepositOnlyPeriod: UFix64
) {

    let adminRef: &MetapierLaunchpad.Admin
    let ownerPassMinter: &MetapierLaunchpadOwnerPass.Minter
    let targetOwnerCollection: Capability<&{NonFungibleToken.CollectionPublic}>

    prepare(launchpadOwner: AuthAccount) {
        self.targetOwnerCollection = getAccount(projectOwner)
            .getCapability<&MetapierLaunchpadOwnerPass.Collection{NonFungibleToken.CollectionPublic}>(MetapierLaunchpadOwnerPass.CollectionPublicPath)

        // fail early if the collection is missing
        if !self.targetOwnerCollection.check() {
            panic("Could not find target owner pass collection")
        }

        self.adminRef = launchpadOwner.borrow<&MetapierLaunchpad.Admin>(from: /storage/MetapierLaunchpadAdmin)
            ?? panic("Could not borrow admin ref")
        
        self.ownerPassMinter = launchpadOwner.borrow<&MetapierLaunchpadOwnerPass.Minter>(
            from: /storage/MetapierLaunchpadOwnerMinter
        ) ?? panic("Could not borrow owner pass minter")
    }

    execute {
        // mint and send an owner pass
        self.ownerPassMinter.mintNFT(recipient: self.targetOwnerCollection, launchPoolId: poolId)

        let newPool <- self.adminRef.createPool(
            poolId: poolId, 
            fundsVault: <- {{fundsToken}}.createEmptyVault(), 
            launchTokenVault: <- {{launchToken}}.createEmptyVault(), 
            price: price,
            personalCap: personalCap,
            totalCap: totalCap,
            fundingStartTime: fundingStartTime,
            fundingEndTime: fundingEndTime,
            claimingStartTime: claimingStartTime, 
            fundsDepositOnlyPeriod: fundsDepositOnlyPeriod,
            whitelist: nil // don't set whitelist at the beginning for simplicity
        )
        self.adminRef.addPool(pool: <- newPool)
    }
}
