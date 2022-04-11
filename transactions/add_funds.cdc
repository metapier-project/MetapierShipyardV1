import {{fundsToken}} from {{fundsTokenAddress}}
import {{launchToken}} from {{launchTokenAddress}}
import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import MetapierLaunchpadPass from "../../contracts/MetapierLaunchpadPass.cdc"
import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"

transaction(poolId: String, amount: UFix64) {

    let userAddress: Address
    let funds: @FungibleToken.Vault
    let passCollectionRef: &MetapierLaunchpadPass.Collection

    prepare(launchpadUser: AuthAccount) {
        self.userAddress = launchpadUser.address

        if launchpadUser.borrow<&MetapierLaunchpadPass.Collection>(from: MetapierLaunchpadPass.CollectionStoragePath) == nil {
            // create a new collection if missing
            let passCollection <- MetapierLaunchpadPass.createEmptyCollection()

            // save the collection to storage
            launchpadUser.save(<- passCollection, to: MetapierLaunchpadPass.CollectionStoragePath)

            // create a link for public collection
            launchpadUser.link<&MetapierLaunchpadPass.Collection{NonFungibleToken.CollectionPublic, MetapierLaunchpadPass.CollectionPublic}>(
                MetapierLaunchpadPass.CollectionPublicPath,
                target: MetapierLaunchpadPass.CollectionStoragePath
            )
        }

        self.passCollectionRef = launchpadUser.borrow<&MetapierLaunchpadPass.Collection>(from: MetapierLaunchpadPass.CollectionStoragePath)!
        
        let fundsTokenVault = launchpadUser.borrow<&{{fundsToken}}.Vault>(from: {{{fundsTokenStoragePath}}})
            ?? panic("Could not borrow a reference to funds vault")
        self.funds <- fundsTokenVault.withdraw(amount: amount)
    }

    execute {
        let poolRef = MetapierLaunchpad.getPublicLaunchPoolById(poolId: poolId)
            ?? panic("launch pool not found")
        
        var passId: UInt64 = 0
        if let participantInfo = poolRef.getParticipantInfo(address: self.userAddress) {
            // user already has a pass for this pool
            passId = participantInfo.passId
        } else {
            // user never participated this pool, create a new pass
            let publicCollectionCap = getAccount(self.userAddress)
                .getCapability<&{NonFungibleToken.CollectionPublic}>(MetapierLaunchpadPass.CollectionPublicPath)
            passId = MetapierLaunchpadPass.mintNewPass(
                recipient: publicCollectionCap,
                fundsVault: <- {{fundsToken}}.createEmptyVault(),
                launchTokenVault: <- {{launchToken}}.createEmptyVault()
            )
        }

        let passRef = self.passCollectionRef.borrowPrivatePass(id: passId)
        let amount = self.funds.balance

        // use the pass to participate properly
        passRef.depositFunds(vault: <- self.funds)
        poolRef.depositFunds(privatePass: passRef, amount: amount)
    }
}
