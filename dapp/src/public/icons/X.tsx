// Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { SVGProps } from 'react';

export default function SvgX(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="none"
            viewBox="0 0 24 24"
            {...props}
        >
            <path
                fill="currentColor"
                d="M5.27992 1.92188C3.42424 1.92188 1.91992 3.4262 1.91992 5.28187V18.7219C1.91992 20.5776 3.42424 22.0819 5.27992 22.0819H18.7199C20.5756 22.0819 22.0799 20.5776 22.0799 18.7219V5.28187C22.0799 3.4262 20.5756 1.92188 18.7199 1.92188H5.27992ZM6.28117 6.24187H10.0912L12.7968 10.0866L16.0799 6.24187H17.2799L13.3387 10.8562L18.1987 17.7619H14.3896L11.2499 13.3012L7.43992 17.7619H6.23992L10.708 12.5316L6.28117 6.24187ZM8.11867 7.20187L14.8902 16.8019H16.3612L9.58961 7.20187H8.11867Z"
            />
        </svg>
    );
}
