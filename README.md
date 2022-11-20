## Novel Site Generator

小説サイトを作るための

### 動作環境

macOS 12.4
（＋ たぶん Linux）

~~~bash
git --version
git version 2.38.1

npm --version
8.19.3
~~~

### インストール

~~~bash
mkdir novel-site-generator

git clone https://github.com

npm install
~~~

### 起動

~~~bash
npm start
~~~

### 各画面の説明

#### リポジトリの作成

#### サイト設定画面

#### 小説編集画面（追加・編集・削除）

#### エディター画面

#### 小説編集画面（ソート）

#### バージョン管理画面

~~~bash
git revert <commit id>..HEAD
~~~

##### 高度なバージョン管理

~~~bash
cd $HOME/.local/share/novel-site-generator/data/[小説のリポジトリ]
git <git command>
~~~

### 小説データ

小説データ：

`$HOME/.local/share/novel-site-generator/data/[小説のリポジトリ]`

小説データ（バックアップ）：

`$HOME/.local/share/novel-site-generator/archive`

設定ファイル：

`$HOME/.config/novel-site-generator/config.json`

### ライセンス

このソフトは MIT ライセンスで提供されています。
