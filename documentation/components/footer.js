// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import React from "react";

const Footer = () => {
  return (
    <footer className="bg-blurple pb-[env(safe-area-inset-bottom)] print:bg-transparent">
      <hr className="dark:border-blurpleDark"></hr>
      <div className="mx-auto flex max-w-[90rem] justify-center py-12 text-white md:justify-start pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
        Copyright {new Date().getFullYear()} ©{" "}
        <a href="https://iota.org" target="_blank">
          , IOTA Stiftung
        </a>
      </div>
    </footer>
  );
};

export default Footer;
