{ pkgs }: with pkgs; {
  deps = with nodePackages; [
    nodejs-19_x
    typescript-language-server
    prettier
    vscode-extensions.esbenp.prettier-vscode
    replitPackages.jest
    napi-rs-cli
    yarn
    cargo
    rust-analyzer
    rustc
    rustfmt
  ];
}