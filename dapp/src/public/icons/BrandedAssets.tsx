// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export default function SvgBrandedAssets(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill="black" />
            <rect
                x="0.5"
                y="0.5"
                width="47"
                height="47"
                rx="11.5"
                stroke="url(#paint0_linear_10153_11045)"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M19 15C16.2386 15 14 17.2386 14 20V26C14 28.7614 16.2386 31 19 31C20.0378 31 20.6297 31.2628 21.6048 31.524L27.4004 33.077C30.0677 33.7917 32.8094 32.2088 33.5241 29.5414L35.077 23.7459C35.7917 21.0785 34.2088 18.3369 31.5415 17.6222L28.9438 16.9261C28.0287 15.7538 26.6024 15 25 15H19ZM29.9886 19.659C29.9796 19.5263 29.9655 19.395 29.9464 19.2653L31.0238 19.554C32.6242 19.9828 33.574 21.6278 33.1452 23.2282L31.5922 29.0238C31.1634 30.6242 29.5184 31.5739 27.918 31.1451L26.5102 30.7679C27.5961 30.4243 28.5216 29.7199 29.1461 28.7955C29.2475 28.6454 29.341 28.4895 29.426 28.3283C29.7925 27.6329 30 26.8407 30 26V20C30 19.8854 29.9962 19.7717 29.9886 19.659ZM27.4491 27.733C27.7961 27.2435 28 26.6456 28 26V20C28 18.3431 26.6569 17 25 17L19 17C17.3431 17 16 18.3431 16 20L16 26C16 27.6515 17.3345 28.9913 18.984 29H25C26.0113 29 26.9057 28.4996 27.4491 27.733Z"
                fill="url(#paint1_linear_10153_11045)"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_10153_11045"
                    x1="48"
                    y1="1.75398e-06"
                    x2="1.90307"
                    y2="49.7226"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="#A139FF" />
                    <stop offset="0.5" stop-color="#3131FF" />
                    <stop offset="1" stop-color="#14F0D6" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_10153_11045"
                    x1="35.2486"
                    y1="15"
                    x2="18.1201"
                    y2="36.5131"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="#A139FF" />
                    <stop offset="0.5" stop-color="#3131FF" />
                    <stop offset="1" stop-color="#14F0D6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
