declare module 'react-native-zeroconf' {
  export interface ZeroconfService {
    name: string;
    host: string;
    port: number;
    addresses: string[];
    fullname: string;
    txt: Record<string, string>;
  }

  export default class Zeroconf {
    scan(type: string, protocol: string, domain: string): void;
    stop(): void;
    publishService(
      type: string,
      protocol: string,
      domain: string,
      name: string,
      port: number,
      txtRecord?: Record<string, string>,
    ): void;
    unpublishService(name: string): void;
    removeDeviceListeners(): void;
    on(event: 'resolved', callback: (service: ZeroconfService) => void): void;
  }
}
