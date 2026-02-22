"use client";

import { useRouter } from "~/lib/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UnifiedSearch } from "@/components/UnifiedSearch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { SearchableEntityType, SearchHit } from "~/types/search";
import { isAdmin } from "~/utils/permissions";

interface GlobalSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchSheet({ isOpen, onClose }: GlobalSearchSheetProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations();

  const handleResultClick = (hit: SearchHit) => {
    // If item is deleted and user is admin, navigate to admin trash page
    if (hit.source.isDeleted && isAdmin(session)) {
      router.push("/admin/trash");
      onClose();
      return;
    }

    // Navigate based on entity type for non-deleted items
    switch (hit.entityType) {
      case SearchableEntityType.REPOSITORY_CASE:
        router.push(`/projects/repository/${hit.source.projectId}/${hit.id}`);
        break;
      case SearchableEntityType.SHARED_STEP:
        router.push(
          `/projects/shared-steps/${hit.source.projectId}?groupId=${hit.id}`
        );
        break;
      case SearchableEntityType.TEST_RUN:
        router.push(`/projects/runs/${hit.source.projectId}/${hit.id}`);
        break;
      case SearchableEntityType.SESSION:
        router.push(`/projects/sessions/${hit.source.projectId}/${hit.id}`);
        break;
      case SearchableEntityType.PROJECT:
        router.push(`/projects/overview/${hit.id}`);
        break;
      case SearchableEntityType.ISSUE:
        // For issues, we'll navigate without the issueId parameter and handle it differently
        router.push(
          `/projects/issues/${hit.source.projectId}?issueId=${hit.id}`
        );
        break;
      case SearchableEntityType.MILESTONE:
        router.push(`/projects/milestones/${hit.source.projectId}/${hit.id}`);
        break;
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="sm:max-w-3xl overflow-y-auto"
        data-testid="global-search-sheet"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center">
            {t("search.title")}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="ml-2 inline-flex"
                  aria-label="Help"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-96 max-h-fit overflow-y-auto text-sm"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("search.help.exactPhrases")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("search.help.exactPhrasesDesc")}
                    </p>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {'"login page"'}
                    </code>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("search.help.booleanOperators")}
                    </h3>
                    <ul className="text-muted-foreground space-y-1 mt-1">
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"AND"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.andDesc")}
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"OR"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.orDesc")}
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"NOT"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.notDesc")}
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"+"}
                        </code>
                        {" / "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"-"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.prefixDesc")}
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"( )"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.groupingDesc")}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("search.help.wildcards")}
                    </h3>
                    <ul className="text-muted-foreground space-y-1 mt-1">
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"test*"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.wildcardMultiDesc")}
                      </li>
                      <li>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {"te?t"}
                        </code>
                        {" \u2014 "}
                        {t("search.help.wildcardSingleDesc")}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("search.help.fuzzyMatching")}
                    </h3>
                    <p className="text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {"logn~"}
                      </code>
                      {" \u2014 "}
                      {t("search.help.fuzzyDesc")}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("search.help.proximity")}
                    </h3>
                    <p className="text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {'"login page"~3'}
                      </code>
                      {" \u2014 "}
                      {t("search.help.proximityDesc")}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <p>{t("search.help.defaultBehavior")}</p>
                    <a
                      href="https://www.elastic.co/docs/explore-analyze/query-filter/languages/lucene-query-syntax"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:opacity-80 mt-1 inline-block"
                    >
                      {t("search.help.fullSyntaxLink")}
                    </a>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("search.title")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <UnifiedSearch
            showEntitySelector={true}
            showProjectToggle={true}
            compactMode={false}
            onResultClick={handleResultClick}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
