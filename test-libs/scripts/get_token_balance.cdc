import FungibleToken from "../../contracts/FungibleToken.cdc"

pub fun main(address: Address): UFix64 {
    return getAccount(address)
        .getCapability({{{tokenPublicBalancePath}}})
        .borrow<&{FungibleToken.Balance}>()!
        .balance
}
