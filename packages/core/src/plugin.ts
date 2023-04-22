export interface Plugin {
  name: string;

  index?: () => Promise<void>;
}
