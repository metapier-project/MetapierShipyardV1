import {{fundsToken}} from {{fundsTokenAddress}}
import MetapierLaunchpad from "../../contracts/MetapierLaunchpad.cdc"
import MetapierLaunchpadOwnerPass from "../../contracts/MetapierLaunchpadOwnerPass.cdc"

transaction(passId: UInt64, amount: UFix64) {

    prepare(projectOwner: AuthAccount) {
        let collection = projectOwner.borrow<&MetapierLaunchpadOwnerPass.Collection>(
            from: MetapierLaunchpadOwnerPass.CollectionStoragePath
        ) ?? panic("Could not find collection")

        let ownerPass = collection.borrowPrivatePass(id: passId)

        let poolRef = MetapierLaunchpad.getPublicLaunchPoolById(poolId: ownerPass.launchPoolId) 
            ?? panic("launch pool not found")

        let fundsTokenVault = projectOwner.borrow<&{{fundsToken}}.Vault>(from: {{{fundsTokenStoragePath}}})
            ?? panic("Could not borrow a reference to funds vault")

        fundsTokenVault.deposit(from: <- poolRef.ownerWithdrawFunds(ownerPass: ownerPass, amount: amount))
    }
}
