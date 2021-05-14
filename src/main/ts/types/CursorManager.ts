export interface CursorManager {
    getBookmark: (type?: number, normalized?: boolean) => Bookmark;
    moveToBookmark: (bookmark: Bookmark) => boolean;
}

export interface Bookmark {

}