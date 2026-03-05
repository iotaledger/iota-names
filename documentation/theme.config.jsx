// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import Footer from './components/footer';

export default {
  logo: <><img className="w-[200px] mx-4 inline text-white" src="/logo.svg"></img><span>IOTA-Names Docs</span></>,
  docsRepositoryBase: 'https://github.com/iotaledger/iota-names/tree/main/documentation',
  project: {
    link: 'https://github.com/iotaledger/iota-names'
  },
  head: (
    <>
      <meta name="description" content="IOTA Name Space Documentation. Integrate IOTA-Names in your projects for the IOTA blockchain." />
      <meta property="og:title" content="IOTA-Names Docs" />
      <meta property="og:description" content="IOTA Name Space Documentation. Integrate IOTA-Names in your projects for the IOTA blockchain." />
      <meta property="og:site_name" content="IOTA Name Space Docs" />
      <meta name="apple-mobile-web-app-title" content="IOTA Name Space Docs" />
    </>
  ),
  feedback: false,
  editLink: false,
  footer: {
    component: Footer,
  }
  // ... other theme options
}
