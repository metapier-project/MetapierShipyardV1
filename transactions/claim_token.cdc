import {{launchToken}} from {{launchTokenAddress}}
import FungibleToken from "../../contracts/FungibleToken.cdc"
import MetapierLaunchpadPass from "../../contracts/MetapierLaunchpadPass.cdc"
import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"

transaction(poolId: String) {

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

        // Launch token Vault setup
        if launchpadUser.borrow<&{{launchToken}}.Vault>(from: {{{launchTokenStoragePath}}}) == nil {
            // Launch token Vault is missing, so create a new Vault and put it in storage
            launchpadUser.save(<-{{launchToken}}.createEmptyVault(), to: {{{launchTokenStoragePath}}})

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            launchpadUser.link<&{{launchToken}}.Vault{FungibleToken.Receiver}>(
                {{{launchTokenPublicReceiverPath}}},
                target: {{{launchTokenStoragePath}}}
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            launchpadUser.link<&{{launchToken}}.Vault{FungibleToken.Balance}>(
                {{{launchTokenPublicBalancePath}}},
                target: {{{launchTokenStoragePath}}}
            )
        }
    }

    execute {
        // ask the pool to withdraw launch token to the pass
        self.poolRef.claimLaunchToken(address: self.userAddress)

        let receiverRef = getAccount(self.userAddress)
            .getCapability({{{launchTokenPublicReceiverPath}}})
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Could not borrow receiver reference to the user's launch token vault")

        // properly deposit the claimed launch token into the receiver
        receiverRef.deposit(from: <- self.passRef.withdrawLaunchToken(amount: self.passRef.getLaunchTokenBalance()))
    }
}
