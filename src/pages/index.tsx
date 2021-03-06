import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import PostSummary from '../components/PostSummary';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>();
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  useEffect(() => {
    const results = postsPagination.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts(results);
  }, [postsPagination.results]);

  function handleLoadMorePosts(): void {
    try {
      fetch(nextPage)
        .then(res => res.json())
        .then(data => {
          setNextPage(data.next_page);
          const prevPosts = [...posts];

          let newPosts = data.results as Post[];

          newPosts = newPosts.map(post => {
            return {
              uid: post.uid,
              first_publication_date: format(
                new Date(post.first_publication_date),
                'dd MMM yyyy',
                {
                  locale: ptBR,
                }
              ),
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
              },
            };
          });

          newPosts.map(post => prevPosts.push(post));
          setPosts(prevPosts);
        });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <main className={`${commonStyles.container} ${styles.container}`}>
        <header className={styles.header}>
          <img src="/logo.svg" alt="logo" />
        </header>

        {posts?.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>

            <div className={styles.infoContainer}>
              <span>
                <FiCalendar />
                {post.first_publication_date}
              </span>
              <span>
                <FiUser />
                {post.data.author}
              </span>
              {/* {data.content && (
                <span>
                  <FiClock />
                  {readingTime} min.
                </span>
              )} */}
            </div>
          </div>
        ))}

        {nextPage && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'blog_post')],
    {
      orderings: '[document.first_publication_date desc]',
      pageSize: 1,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));

  // const results = postsResponse.results.map(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: format(
  //       new Date(post.first_publication_date),
  //       'dd MMM yyyy',
  //       {
  //         locale: ptBR,
  //       }
  //     ),
  //     data: {
  //       title: post.data.title,
  //       subtitle: post.data.subtitle,
  //       author: post.data.author,
  //     },
  //   };
  // });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
