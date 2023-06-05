import { useMemo, useSyncExternalStore } from "react";
import { subscribe } from "./appwrite";
import { CommentModel, convertPageCommentModel } from "./convert";
import { DATABASE_ID, getPageComments, collections } from "./storage";
import { orderBy } from "natural-orderby";

type SubscribeToPageCommentsArgs = {
  pageId: string;
  onNewPageComment: (commentModel: CommentModel) => void;
};

function subscribeToPageComments({
  pageId,
  onNewPageComment,
}: SubscribeToPageCommentsArgs) {
  const pageCommentsChannelName = `databases.${DATABASE_ID}.collections.${collections.PAGE_COMMENTS}.documents`;
  const unsubscribe = subscribe(pageCommentsChannelName, (realtimeEvent) => {
    const pageCommentsCreateDocumentEvent = `${pageCommentsChannelName}.*.create`;

    if (realtimeEvent.events.includes(pageCommentsCreateDocumentEvent)) {
      const newlyCreatedPageComment = convertPageCommentModel(
        realtimeEvent.payload
      );

      if (newlyCreatedPageComment.pageId === pageId) {
        onNewPageComment(newlyCreatedPageComment);
      }
    }
  });

  return unsubscribe;
}

const PageCommentStore: Map<string, PageIdCommentStore> = new Map();

type SyncSubscribe = Parameters<typeof useSyncExternalStore>["0"];
type SyncGetSnapshot<SnapShot> = Parameters<
  typeof useSyncExternalStore<SnapShot>
>["1"];

function syncPageComments(pageId: string): SyncSubscribe {
  return (onStoreChange) => {
    const pageIdCommentStore = getPageIdStoreOrInitializeIt(
      PageCommentStore,
      pageId,
      onStoreChange
    );
    const unsubscribeWithAppwrite = subscribeToPageComments({
      pageId,
      onNewPageComment(newComment) {
        console.log({ newComment });
        pageIdCommentStore.addRealtimeComment(newComment);
        onStoreChange();
      },
    });

    return unsubscribeWithAppwrite;
  };
}

const EMPTY_PAGE_COMMENT: Array<CommentModel> = [];

function getPageCommentSnapshot(
  pageId: string
): SyncGetSnapshot<CommentModel[]> {
  return () => {
    const pageIdStore = PageCommentStore.get(pageId);

    if (!pageIdStore) {
      return EMPTY_PAGE_COMMENT;
    }

    return pageIdStore.comments;
  };
}

function getPageIdStoreOrInitializeIt(
  pageCommentStore: typeof PageCommentStore,
  pageId: string,
  onStoreChange: () => void
) {
  const isStoreNotIntialized = pageCommentStore.get(pageId) === undefined;

  if (isStoreNotIntialized) {
    pageCommentStore.set(pageId, new PageIdCommentStore());
  }

  const pageIdCommentStore = pageCommentStore.get(pageId);

  if (!pageIdCommentStore) {
    throw new Error("Unreachable");
  }

  getPageComments({ pageId }).then((pastComments) => {
    pageIdCommentStore.setPastComments(pastComments);
    onStoreChange();
  });

  return pageIdCommentStore;
}

class PageIdCommentStore {
  #commentIdStore: Map<string, boolean>;
  comments: Array<CommentModel>;

  constructor() {
    this.#commentIdStore = new Map();
    this.comments = [];
  }

  #addId(comment: CommentModel) {
    this.#commentIdStore.set(comment.id, true);
  }

  #addIds(comments: Array<CommentModel>) {
    for (const comment of comments) {
      this.#addId(comment);
    }
  }

  #isCommentUnique(comment: CommentModel) {
    return !this.#commentIdStore.has(comment.id);
  }

  setPastComments(pastComments: Array<CommentModel>) {
    const isRealtimeCommentsPresent = this.comments.length !== 0;

    if (!isRealtimeCommentsPresent) {
      this.#addIds(pastComments);
      this.comments = pastComments;
      return;
    }

    const filteredComments = pastComments.filter((v) =>
      this.#isCommentUnique(v)
    );

    this.comments = orderBy(
      filteredComments.concat(this.comments),
      (v) => v.createdAt,
      "asc"
    );
  }

  addRealtimeComment(comment: CommentModel) {
    if (!this.#isCommentUnique(comment)) {
      return;
    }

    this.#addId(comment);

    this.comments.push(comment);
    this.comments = orderBy(this.comments, (v) => v.createdAt, "asc");
  }
}

export function useSyncPageComments(pageId: string) {
  const syncSubscribe = useMemo(() => syncPageComments(pageId), [pageId]);
  const getSnapshot = useMemo(() => getPageCommentSnapshot(pageId), [pageId]);

  const snapshot = useSyncExternalStore(syncSubscribe, getSnapshot);

  return snapshot;
}
