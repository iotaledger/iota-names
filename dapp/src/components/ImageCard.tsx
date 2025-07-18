// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';

interface ImageCardprops {
    /**
     * title text
     */
    title: string;
    /**
     * body text
     */
    body?: React.ReactNode;
    /**
     * image url
     */
    image?: string;
    /**
     * alt text for the image
     */
    alt?: string;
}
export function ImageCard({ title, body, image, alt }: ImageCardprops): JSX.Element {
    return (
        <div
            className={clsx(
                'w-full flex flex-col items-center overflow-hidden rounded-3xl bg-names-neutral-6',
            )}
        >
            <img
                src={image}
                alt={alt || image}
                className={clsx('w-full h-auto object-cover aspect-video')}
            />

            <div
                className={clsx(
                    'flex flex-col justify-end items-start pt-lg px-xl pb-xl self-stretch gap-x-xs',
                )}
            >
                <div className={clsx('flex flex-col items-start self-stretch w-full')}>
                    <h2 className="text-title-lg text-names-primary-100">{title}</h2>
                </div>
                {body && <p className="text-body-lg text-names-neutral-70">{body}</p>}
            </div>
        </div>
    );
}
