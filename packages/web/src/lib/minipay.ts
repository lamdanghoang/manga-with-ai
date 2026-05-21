export function isMiniPay(): boolean {
  return typeof window !== 'undefined' && (window as any).ethereum?.isMiniPay === true;
}

export function getEthereumProvider() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('window.ethereum is required. Please run this app inside MiniPay.');
  }
  return (window as any).ethereum;
}
