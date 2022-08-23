{ pkgs }: {
	deps = with pkgs; [
		nodejs-18_x
        nodePackages.typescript-language-server
        nodePackages.yarn
		nodePackages.prettier
        replitPackages.jest
	];
}