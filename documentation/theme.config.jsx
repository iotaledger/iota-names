// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useRouter } from 'next/router';
import Footer from './components/footer';

export default {
    logo: <><img className="w-[200px] mx-4 inline text-white" src="/logo.svg"></img><span>IOTA Name Service Docs</span></>,
    docsRepositoryBase: 'https://github.com/iotaledger/iotans-contracts/tree/main/documentation',
    project: {
      link: 'https://github.com/iotaledger/iotans-contracts'
    },
    useNextSeoProps() {
      const { asPath } = useRouter();
  
      return {
        titleTemplate: asPath !== '/' ? '%s | IOTANS Docs' : 'IOTANS Docs',
        description:
          'IOTA Name Space Documentation. Integrate IOTANS in your projects for the IOTA blockchain.',
        openGraph: {
          title: 'IOTANS Docs',
          description:
            'IOTA Name Space Documentation. Integrate IOTANS in your projects for the IOTA blockchain.',
          site_name: 'IOTA Name Space Docs',
        },
        additionalMetaTags: [{ content: 'IOTA Name Space Docs', name: 'apple-mobile-web-app-title' }],
      };
    },
    feedback: {
      content: ""
    },
    editLink: {
      component: null
    },
    footer: {
      component: Footer,
    }
    // ... other theme options
  }