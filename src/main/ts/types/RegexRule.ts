export interface RegexRule {
    name: string;
    about?: { url: string; label: string; }[];
    correctionLabel?: string;
    search: RegExp;
    replace: string;
}