// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { SVGProps } from 'react';

export function NameDisplayGradient(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="220"
            height="220"
            viewBox="0 0 220 220"
            fill="none"
            {...props}
        >
            <g clipPath="url(#paint0_angular_11012_3982_clip_path)">
                <g transform="matrix(0.2645 0.26825 -0.26825 0.2645 113.75 110)">
                    <foreignObject x="-423.773" y="-423.773" width="847.547" height="847.547">
                        <div
                            style={{
                                background:
                                    'conic-gradient(from 90deg,rgba(186, 186, 186, 1) 0deg,rgba(0, 0, 0, 1) 69.2516deg,rgba(187, 187, 187, 1) 178.657deg,rgba(0, 0, 0, 1) 204.259deg,rgba(187, 187, 187, 1) 268.301deg,rgba(0, 0, 0, 1) 315.035deg,rgba(187, 187, 187, 1) 360deg)',
                                height: '100%',
                                width: '100%',
                                opacity: 1,
                            }}
                        ></div>
                    </foreignObject>
                </g>
            </g>
            <path d="M12 0.5H208C214.351 0.5 219.5 5.64873 219.5 12V208C219.5 214.351 214.351 219.5 208 219.5H12C5.64873 219.5 0.5 214.351 0.5 208V12C0.500001 5.64873 5.64873 0.5 12 0.5Z" />
            <path
                d="M12 0.5H208C214.351 0.5 219.5 5.64873 219.5 12V208C219.5 214.351 214.351 219.5 208 219.5H12C5.64873 219.5 0.5 214.351 0.5 208V12C0.500001 5.64873 5.64873 0.5 12 0.5Z"
                fill="url(#paint1_linear_11012_3982)"
                className="mix-blend-color-burn"
            />
            <path
                d="M12 0.5H208C214.351 0.5 219.5 5.64873 219.5 12V208C219.5 214.351 214.351 219.5 208 219.5H12C5.64873 219.5 0.5 214.351 0.5 208V12C0.500001 5.64873 5.64873 0.5 12 0.5Z"
                stroke="url(#paint2_linear_11012_3982)"
            />
            <defs>
                <clipPath id="paint0_angular_11012_3982_clip_path">
                    <path d="M12 0.5H208C214.351 0.5 219.5 5.64873 219.5 12V208C219.5 214.351 214.351 219.5 208 219.5H12C5.64873 219.5 0.5 214.351 0.5 208V12C0.500001 5.64873 5.64873 0.5 12 0.5Z" />
                </clipPath>
                <linearGradient
                    id="paint1_linear_11012_3982"
                    x1="220"
                    y1="219.794"
                    x2="-7.89517"
                    y2="8.51643"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0.168251" stopColor="#8B0CFE" />
                    <stop offset="0.528848" stopColor="#3131FF" />
                    <stop offset="0.937525" stopColor="#14F0D6" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_11012_3982"
                    x1="220"
                    y1="219.794"
                    x2="-7.89517"
                    y2="8.51643"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A139FF" />
                    <stop offset="0.368094" stopColor="#3131FF" />
                    <stop offset="1" stopColor="#14F0D6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
