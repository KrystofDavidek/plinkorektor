export interface RegexRule {
    name: string;
    description: string;
    about?: { url: string; label: string; }[];
    correctionLabel?: string;
    search: RegExp;
    replace: string;
}