import FungibleToken from "../../contracts/FungibleToken.cdc"
import {{token}} from "../contracts/TestToken.cdc"

transaction(amount: UFix64) {
    prepare(signer: AuthAccount) {
        // {{token}} Vault
        if signer.borrow<&{{token}}.Vault>(from: {{token}}.TokenStoragePath) == nil {
            // Create a new {{token}} Vault and put it in storage
            signer.save(<-{{token}}.createEmptyVault(), to: {{token}}.TokenStoragePath)

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            signer.link<&{{token}}.Vault{FungibleToken.Receiver}>(
                {{token}}.TokenPublicReceiverPath,
                target: {{token}}.TokenStoragePath
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            signer.link<&{{token}}.Vault{FungibleToken.Balance}>(
                {{token}}.TokenPublicBalancePath,
                target: {{token}}.TokenStoragePath
            )
        }

        let vault = signer.borrow<&{{token}}.Vault>(from: {{token}}.TokenStoragePath)
            ?? panic("Could not borrow a reference to Vault")
        vault.deposit(from: <- {{token}}.createTestVault(amount: amount))
    }
}
