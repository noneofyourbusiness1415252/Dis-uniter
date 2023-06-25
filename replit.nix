{ pkgs }: with pkgs; {
  deps = with nodePackages; [
    nodejs_20
    napi-rs-cli
    nodePackages.yarn
		prettier
    cargo
    rust-analyzer
    rustc
    rustfmt
  ];
}