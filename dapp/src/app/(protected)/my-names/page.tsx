// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Delete } from '@iota/apps-ui-icons';
import { Card, CardAction, CardActionType, CardBody, CardType, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck, DeleteNameDialog, UpdateNameDialog } from '@/components';
import { useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const [deleteNameDialog, setDeleteNameDialog] = useState<string | null>(null);

    const { data: domains } = useRegistrationNfts('domain');
    const { data: subdomains } = useRegistrationNfts('subdomain');

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            {updateNameDialog ? (
                <UpdateNameDialog
                    name={updateNameDialog}
                    open
                    setOpen={() => setUpdateNameDialog(null)}
                />
            ) : null}
            {deleteNameDialog ? (
                <DeleteNameDialog
                    name={deleteNameDialog}
                    open
                    setOpen={() => setDeleteNameDialog(null)}
                />
            ) : null}
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-y-sm items-center w-1/2">
                {domains?.map((nft) => (
                    <Card key={nft.name} type={CardType.Filled}>
                        <CardBody
                            title={nft.name}
                            subtitle={`Expiration Date: ${
                                nft?.expiration_timestamp_ms
                                    ? new Date(nft.expiration_timestamp_ms).toLocaleDateString(
                                          'en-US',
                                          {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          },
                                      )
                                    : '--'
                            }`}
                            clickableAction={
                                nft.isExpired ? (
                                    <Delete
                                        className="text-error-30 dark:text-error-70 cursor-pointer"
                                        onClick={() => setDeleteNameDialog(nft.name)}
                                    />
                                ) : undefined
                            }
                        />
                        <CardAction
                            title="Manage"
                            type={CardActionType.Button}
                            onClick={() => setUpdateNameDialog(nft.name)}
                        />
                    </Card>
                ))}
            </div>
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            {subdomains?.length && (
                <div className="flex flex-col gap-y-sm items-center w-1/2">
                    {subdomains.map((subdomain) => (
                        <Card key={subdomain.name} type={CardType.Filled}>
                            <CardBody
                                title={subdomain.name}
                                subtitle={`Expiration Date: ${
                                    subdomain?.expiration_timestamp_ms
                                        ? new Date(
                                              subdomain.expiration_timestamp_ms,
                                          ).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                        : '--'
                                }`}
                                clickableAction={
                                    subdomain.isExpired ? (
                                        <Delete
                                            className="text-error-30 dark:text-error-70 cursor-pointer"
                                            onClick={() => setDeleteNameDialog(subdomain.name)}
                                        />
                                    ) : undefined
                                }
                            />
                            <CardAction
                                type={CardActionType.SupportingText}
                                subtitle={subdomain.description ?? ''}
                            />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyNamesPage;
