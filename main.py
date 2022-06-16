# gitsync

import json
from urllib.request import Request, urlopen
from urllib.parse import urlparse


def main():
    f = open('config.json')
    data = json.load(f)

    source_type = data['source']['type']
    source_token = data['source']['token']
    source_url = "https://api.github.com" if source_type == 'github' and 'url' not in data[
        'source'] else data['source']['url']

    if source_type == 'github':

        source_repositories = []
        page = 1
        complete = False
        while not complete:
            parsed_url = urlparse(source_url)
            request = Request(
                f'{parsed_url.scheme}://api.{parsed_url.netloc}/user/repos?per_page=100&page={page}')
            request.add_header('Authorization', f'token {source_token}')
            response = json.load(urlopen(request))

            if not response:
                complete = True
                break

            source_repositories.extend(response)
            page += 1

    elif source_type == 'gitea':
        pass

    dest_type = data['destination']['type']
    dest_token = data['destination']['token']
    dest_url = "https://api.github.com" if dest_type == 'github' and 'url' not in data[
        'destination'] else data['destination']['url']

    if dest_type == 'github':
        pass
    elif dest_type == 'gitea':
        dest_repositories = []
        page = 1
        complete = False
        while not complete:
            parsed_url = urlparse(dest_url)
            request = Request(
                f'{parsed_url.scheme}://{parsed_url.netloc}/api/v1/user/repos?limit=100&page={page}')
            request.add_header('Authorization', f'token {dest_token}')
            response = json.load(urlopen(request))

            if not response:
                complete = True
                break

            dest_repositories.extend(response)
            page += 1

    if len(source_repositories) > len(dest_repositories):
        # 
        pass
    else:
        # just backup
        pass


if __name__ == "__main__":
    main()

'''
TODO:
1. Get number of repos from source
2. Get number of repos from dest
3. If numbers match, then skip and just mirror sync all repos
4. Else if numbers do not match, find the extra repos from source, and create a new mirror on dest
'''
