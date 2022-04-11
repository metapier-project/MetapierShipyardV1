import FungibleToken from "../../contracts/FungibleToken.cdc"
import MetapierLaunchpadPass from "../../contracts/MetapierLaunchpadPass.cdc"
import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"

transaction(poolId: String, amount: UFix64) {

    let userAddress: Address
    let poolRef: &{MetapierLaunchpad.PublicLaunchPool}
    let passRef: &MetapierLaunchpadPass.NFT

    prepare(launchpadUser: AuthAccount) {
        self.userAddress = launchpadUser.address

        self.poolRef = MetapierLaunchpad.getPublicLaunchPoolById(poolId: poolId)
            ?? panic("launch pool not found")
        
        let participantInfo = self.poolRef.getParticipantInfo(address: launchpadUser.address)
            ?? panic("never participated this pool")

        let passCollectionRef = launchpadUser.borrow<&MetapierLaunchpadPass.Collection>(from: MetapierLaunchpadPass.CollectionStoragePath)
            ?? panic("collection not found")

        self.passRef = passCollectionRef.borrowPrivatePass(id: participantInfo.passId)
    }

    execute {
        // ask the pool to withdraw funds to the pass
        self.poolRef.withdrawFunds(privatePass: self.passRef, amount: amount)

        let receiverRef = getAccount(self.userAddress)
            .getCapability({{{fundsTokenReceiverPath}}})
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Could not borrow receiver reference to the user's funds vault")
        
        // properly deposit the withdrawn funds into the funds receiver
        receiverRef.deposit(from: <- self.passRef.withdrawFunds(amount: amount))
    }
}
