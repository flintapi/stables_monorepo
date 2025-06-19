import { Store } from '@tanstack/store'

interface INetworkStore {
  NETWORKS: Array<{
    name: string
    label: string
    url: string
    icon: string
    token: string
  }>
  selected: string | undefined
}

export const networkStore = new Store<INetworkStore>({
  NETWORKS: [
    {
      name: 'Base sepolia',
      label: 'BASE',
      url: 'https://mainnet.com',
      icon: 'MainnetIcon',
      token: 'tETH',
    },
    {
      name: 'Ethereum Sepolia',
      label: 'ETH',
      url: 'https://testnet.com',
      icon: 'TestnetIcon',
      token: 'tETH',
    },
    {
      name: 'Polygon Mumbai',
      label: 'MATIC',
      url: 'https://testnet.com',
      icon: 'TestnetIcon',
      token: 'tMATIC',
    },
    {
      name: 'Asset Chain Enugu',
      label: 'RWA',
      url: 'https://testnet.com',
      icon: 'TestnetIcon',
      token: 'tRWA',
    },
    {
      name: 'BSC Testnet',
      label: 'BNB',
      url: 'https://testnet.com',
      icon: 'TestnetIcon',
      token: 'tBNB',
    },
    {
        name: "Bantu Testnet",
        label: "XBN",
        url: "https://testnet.com",
        icon: "TestnetIcon",
        token: "tXBN"
    }
  ],
  selected: undefined,
})

// const deriveSelected = new Derived({
//   fn: () =>
//     networkStore.state.NETWORKS.find(
//       (n) => n.label === networkStore.state.selected,
//     ),
//   deps: [networkStore],
// })

// deriveSelected.subscribe((value) => {
//   console.log('Subscribe to derived selected store', value)
// })

// deriveSelected.mount()
