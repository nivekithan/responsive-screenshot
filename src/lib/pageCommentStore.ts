import { useMemo, useSyncExternalStore } from "react";
import { subscribe } from "./appwrite";
import { IssueModel, convertPageIssueModel } from "./convert";
import { DATABASE_ID, getPageIssues, collections } from "./storage";
import { orderBy } from "natural-orderby";

type SubscribeToPageIssuesArgs = {
  pageId: string;
  onNewPageIssue: (issueModel: IssueModel) => void;
  onIssueDelete: (issueModel: IssueModel) => void;
};

function subscribeToPageIssue({
  pageId,
  onNewPageIssue,
  onIssueDelete,
}: SubscribeToPageIssuesArgs) {
  const pageIssueChannelName = `databases.${DATABASE_ID}.collections.${collections.PAGE_ISSUES}.documents`;
  const unsubscribe = subscribe(pageIssueChannelName, (realtimeEvent) => {
    const pageIssueCreateDocumentEvent = `${pageIssueChannelName}.*.create`;
    const pageIssuesDeleteDocumentEvent = `${pageIssueChannelName}.*.delete`;

    if (realtimeEvent.events.includes(pageIssueCreateDocumentEvent)) {
      const newlyCreatedPageIssue = convertPageIssueModel(
        realtimeEvent.payload
      );

      if (newlyCreatedPageIssue.pageId === pageId) {
        onNewPageIssue(newlyCreatedPageIssue);
      }
    } else if (realtimeEvent.events.includes(pageIssuesDeleteDocumentEvent)) {
      const deletedIssue = convertPageIssueModel(realtimeEvent.payload);

      if (deletedIssue.pageId === pageId) {
        onIssueDelete(deletedIssue);
      }
    }
  });

  return unsubscribe;
}

const GlobalIssuesStore: Map<string, PageIssueStore> = new Map();

type SyncSubscribe = Parameters<typeof useSyncExternalStore>["0"];
type SyncGetSnapshot<SnapShot> = Parameters<
  typeof useSyncExternalStore<SnapShot>
>["1"];

function syncPageIssue(pageId: string): SyncSubscribe {
  return (onStoreChange) => {
    const pageIssueStore = getPageIssueStoreOrInitializeIt(
      GlobalIssuesStore,
      pageId,
      onStoreChange
    );

    const unsubscribeWithAppwrite = subscribeToPageIssue({
      pageId,
      onNewPageIssue(newIssue) {
        pageIssueStore.addRealtimeIssue(newIssue);
        onStoreChange();
      },
      onIssueDelete(issueModel) {
        pageIssueStore.deleteIssue(issueModel.id);
        onStoreChange();
      },
    });

    return unsubscribeWithAppwrite;
  };
}

const EMPTY_PAGE_ISSUE: Array<IssueModel> = [];

function getPageIssueSnapshot(pageId: string): SyncGetSnapshot<IssueModel[]> {
  return () => {
    const pageIdStore = GlobalIssuesStore.get(pageId);

    if (!pageIdStore) {
      return EMPTY_PAGE_ISSUE;
    }

    return pageIdStore.issue;
  };
}

function getPageIssueStoreOrInitializeIt(
  globalIssueStore: typeof GlobalIssuesStore,
  pageId: string,
  onStoreChange: () => void
) {
  const isStoreNotIntialized = globalIssueStore.get(pageId) === undefined;

  if (isStoreNotIntialized) {
    globalIssueStore.set(pageId, new PageIssueStore());
  }

  const pageIssueStore = globalIssueStore.get(pageId);

  if (!pageIssueStore) {
    throw new Error("Unreachable");
  }

  getPageIssues({ pageId }).then((pastIssues) => {
    if (pastIssues.valid) {
      pageIssueStore.setPastIssues(pastIssues.pageIssueList);
      onStoreChange();
    }
    //TODO: Add Error handling
  });

  return pageIssueStore;
}

class PageIssueStore {
  #issueStore: Map<string, boolean>;
  issue: Array<IssueModel>;

  constructor() {
    this.#issueStore = new Map();
    this.issue = [];
  }

  #addId(issue: IssueModel) {
    this.#issueStore.set(issue.id, true);
  }

  #addIds(issues: Array<IssueModel>) {
    for (const issue of issues) {
      this.#addId(issue);
    }
  }

  #isIssueUnique(issue: IssueModel) {
    return !this.#issueStore.has(issue.id);
  }

  setPastIssues(pastIssues: Array<IssueModel>) {
    const isRealtimeIssuePresent = this.issue.length !== 0;

    if (!isRealtimeIssuePresent) {
      this.#addIds(pastIssues);
      this.issue = pastIssues;
      return;
    }

    const filteredIssues = pastIssues.filter((v) => this.#isIssueUnique(v));

    this.issue = orderBy(
      filteredIssues.concat(this.issue),
      (v) => v.createdAt,
      "asc"
    );
  }

  addRealtimeIssue(issue: IssueModel) {
    if (!this.#isIssueUnique(issue)) {
      return;
    }

    this.#addId(issue);

    this.issue.push(issue);
    this.issue = orderBy(this.issue, (v) => v.createdAt, "asc");
  }

  deleteIssue(issueId: string) {
    const issueIndex = this.issue.findIndex((v) => v.id === issueId);

    if (issueIndex === -1) {
      return;
    }

    this.issue.splice(issueIndex, 1);
    this.issue = [...this.issue];
  }
}

export function useSyncPageIssue(pageId: string) {
  const syncSubscribe = useMemo(() => syncPageIssue(pageId), [pageId]);
  const getSnapshot = useMemo(() => getPageIssueSnapshot(pageId), [pageId]);

  const snapshot = useSyncExternalStore(syncSubscribe, getSnapshot);

  return snapshot;
}
