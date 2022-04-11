import {{launchToken}} from {{launchTokenAddress}}
import MetapierLaunchpad from "../contracts/MetapierLaunchpad.cdc"

transaction(poolId: String, amount: UFix64) {

    prepare(projectOwner: AuthAccount) {
        let poolRef = MetapierLaunchpad.getPublicLaunchPoolById(poolId: poolId) 
            ?? panic("launch pool not found")

        let launchTokenVault = projectOwner.borrow<&{{launchToken}}.Vault>(from: {{{launchTokenStoragePath}}})
            ?? panic("Could not borrow a reference to launch vault")
        
        poolRef.depositLaunchToken(vault: <- launchTokenVault.withdraw(amount: amount))
    }
}
