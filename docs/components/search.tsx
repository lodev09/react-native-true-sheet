'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useContext, useState } from 'react';
import { VersionsContext } from '@/app/provider';

export default function CustomSearchDialog(props: SharedProps) {
  const versions = useContext(VersionsContext);
  const [tag, setTag] = useState<string>();
  const { search, setSearch, query } = useDocsSearch({ client: fetchClient({ tag }) });

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
        <SearchDialogFooter>
          <TagsList tag={tag} onTagChange={setTag} allowClear>
            {versions.map((item) => (
              <TagsListItem key={item.value} value={item.value}>
                {item.name}
              </TagsListItem>
            ))}
          </TagsList>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
