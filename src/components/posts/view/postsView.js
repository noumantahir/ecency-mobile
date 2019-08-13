/* eslint-disable react/jsx-wrap-multilines */
import React, { Component, Fragment } from 'react';
import { FlatList, View, ActivityIndicator, RefreshControl } from 'react-native';
import { injectIntl } from 'react-intl';
import { withNavigation } from 'react-navigation';
import get from 'lodash/get';
// STEEM
import { getPostsSummary, getPost } from '../../../providers/steem/dsteem';
import { getPromotePosts } from '../../../providers/esteem/esteem';

// COMPONENTS
import { PostCard } from '../../postCard';
import { FilterBar } from '../../filterBar';
import { PostCardPlaceHolder, NoPost } from '../../basicUIElements';
import { POPULAR_FILTERS, PROFILE_FILTERS } from '../../../constants/options/filters';

// Styles
import styles from './postsStyles';
import { default as ROUTES } from '../../../constants/routeNames';

class PostsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      posts: props.isConnected ? [] : props.feedPosts,
      startAuthor: '',
      startPermlink: '',
      refreshing: false,
      isLoading: false,
      isShowFilterBar: true,
      selectedFilterIndex: get(props, 'selectedOptionIndex', 0),
      isNoPost: false,
      promotedPosts: [],
      scrollOffsetY: 0,
    };
  }

  // Component Functions
  componentWillMount() {
    const { navigation } = this.props;

    navigation.setParams({
      scrollToTop: this._scrollToTop,
    });
  }

  async componentDidMount() {
    const { isConnected, pageType } = this.props;

    if (isConnected) {
      if (pageType !== 'profiles') await this._getPromotePosts();
      this._loadPosts();
    } else {
      this.setState({
        refreshing: false,
        isLoading: false,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { currentAccountUsername, changeForceLoadPostState } = this.props;

    if (
      (currentAccountUsername &&
        currentAccountUsername !== nextProps.currentAccountUsername &&
        nextProps.currentAccountUsername) ||
      nextProps.forceLoadPost
    ) {
      // Set all initial data (New user new rules)
      this.setState(
        {
          posts: [],
          startAuthor: '',
          startPermlink: '',
          refreshing: false,
          isLoading: false,
          selectedFilterIndex: get(nextProps, 'selectedOptionIndex', 0),
          isNoPost: false,
        },
        () => {
          this._loadPosts();
          if (changeForceLoadPostState) {
            changeForceLoadPostState(false);
          }
        },
      );
    }
  }

  _getPromotePosts = async () => {
    const { currentAccountUsername } = this.props;

    await getPromotePosts().then(async res => {
      const promotedPosts = [];

      if (res && res.length) {
        res.forEach(async item => {
          const post = await getPost(item.author, item.permlink, currentAccountUsername, true);
          promotedPosts.push(post);
        });
      }

      await this.setState({ promotedPosts });
    });
  };

  _scrollToTop = () => {
    if (this.flatList) this.flatList.scrollToOffset({ x: 0, y: 0, animated: true });
  };

  _loadPosts = async () => {
    const {
      getFor,
      tag,
      currentAccountUsername,
      pageType,
      nsfw,
      setFeedPosts,
      isConnected,
    } = this.props;
    const {
      posts,
      startAuthor,
      startPermlink,
      refreshing,
      selectedFilterIndex,
      isLoading,
      promotedPosts,
    } = this.state;
    const filter =
      pageType === 'posts'
        ? POPULAR_FILTERS[selectedFilterIndex].toLowerCase()
        : PROFILE_FILTERS[selectedFilterIndex].toLowerCase();
    let options;
    let newPosts = [];
    const limit = promotedPosts ? (promotedPosts.length >= 3 ? 9 : 6) : 3;

    if (!isConnected) {
      this.setState({
        refreshing: false,
        isLoading: false,
      });
      return null;
    }

    if (isLoading) {
      return null;
    }

    this.setState({ isLoading: true });
    if (tag || filter === 'feed' || filter === 'blog' || getFor === 'blog') {
      options = {
        tag,
        limit,
      };
    } else if (filter === 'reblogs') {
      options = {
        tag,
        limit,
      };
    } else {
      options = {
        limit,
      };
    }

    if (startAuthor && startPermlink && !refreshing) {
      options.start_author = startAuthor;
      options.start_permlink = startPermlink;
    }

    getPostsSummary(filter, options, currentAccountUsername, nsfw)
      .then(result => {
        if (result.length > 0) {
          let _posts = result;

          if (filter === 'reblogs') {
            for (let i = _posts.length - 1; i >= 0; i--) {
              if (_posts[i].author === currentAccountUsername) {
                _posts.splice(i, 1);
              }
            }
          }
          if (_posts.length > 0) {
            if (posts.length > 0) {
              if (refreshing) {
                // TODO: make sure post is not duplicated, because checking with `includes` might re-add post
                // if there was change in post object from blockchain
                newPosts = _posts.filter(post => posts.includes(post));
                _posts = [...newPosts, ...posts];
              } else {
                _posts.shift();
                _posts = [...posts, ..._posts];
              }
            }

            if (posts.length < 5) {
              setFeedPosts(_posts);
            }

            if (refreshing && newPosts.length > 0) {
              this.setState({
                posts: _posts,
              });
            } else if (!refreshing) {
              if (!startAuthor) {
                promotedPosts.map((promotedItem, i) => {
                  _posts.splice((i + 1) * 3, i * 3, promotedItem);
                });
              }

              this.setState({
                posts: _posts,
                startAuthor: result[result.length - 1] && result[result.length - 1].author,
                startPermlink: result[result.length - 1] && result[result.length - 1].permlink,
              });
            }

            this.setState({
              refreshing: false,
              isLoading: false,
            });
          }
        } else if (result.length === 0) {
          this.setState({ isNoPost: true });
        }
      })
      .catch(() => {
        this.setState({
          refreshing: false,
        });
      });
  };

  _handleOnRefreshPosts = () => {
    this.setState(
      {
        refreshing: true,
      },
      () => {
        this._loadPosts();
      },
    );
  };

  _renderFooter = () => {
    const { isLoading } = this.state;

    if (isLoading) {
      return (
        <View style={styles.flatlistFooter}>
          <ActivityIndicator animating size="large" />
        </View>
      );
    }
    return null;
  };

  _handleOnDropdownSelect = async index => {
    await this.setState({
      selectedFilterIndex: index,
      posts: [],
      startAuthor: '',
      startPermlink: '',
      isNoPost: false,
    });
    this._loadPosts();
  };

  _handleOnPressLogin = () => {
    const { navigation } = this.props;
    navigation.navigate(ROUTES.SCREENS.LOGIN);
  };

  _renderEmptyContent = () => {
    const { intl, getFor, isLoginDone, isLoggedIn, tag } = this.props;
    const { isNoPost } = this.state;

    if (getFor === 'feed' && isLoginDone && !isLoggedIn) {
      return (
        <NoPost
          imageStyle={styles.noImage}
          isButtonText
          defaultText={intl.formatMessage({
            id: 'profile.login_to_see',
          })}
          handleOnButtonPress={this._handleOnPressLogin}
        />
      );
    }

    if (isNoPost) {
      return (
        <NoPost
          imageStyle={styles.noImage}
          name={tag}
          text={intl.formatMessage({
            id: 'profile.havent_posted',
          })}
          defaultText={intl.formatMessage({
            id: 'profile.login_to_see',
          })}
        />
      );
    }

    return (
      <Fragment>
        <PostCardPlaceHolder />
        <PostCardPlaceHolder />
      </Fragment>
    );
  };

  _handleOnScroll = event => {
    const { scrollOffsetY } = this.state;
    const { handleOnScroll } = this.props;
    const currentOffset = event.nativeEvent.contentOffset.y;

    if (handleOnScroll) handleOnScroll();
    this.setState({ scrollOffsetY: currentOffset });
    this.setState({ isShowFilterBar: scrollOffsetY > currentOffset || scrollOffsetY <= 0 });
  };

  render() {
    const { refreshing, posts, isShowFilterBar } = this.state;
    const {
      filterOptions,
      selectedOptionIndex,
      isDarkTheme,
      isHideImage,
      hanldeImagesHide,
    } = this.props;

    return (
      <View style={styles.container}>
        {filterOptions && isShowFilterBar && (
          <FilterBar
            dropdownIconName="arrow-drop-down"
            options={filterOptions}
            selectedOptionIndex={selectedOptionIndex}
            defaultText={filterOptions[selectedOptionIndex]}
            rightIconName="view-module"
            rightIconType="MaterialIcons"
            onDropdownSelect={this._handleOnDropdownSelect}
            onRightIconPress={hanldeImagesHide}
          />
        )}

        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PostCard isRefresh={refreshing} content={item} isHideImage={isHideImage} />
          )}
          keyExtractor={content => content.permlink}
          onEndReached={() => this._loadPosts()}
          removeClippedSubviews
          refreshing={refreshing}
          onRefresh={() => this._handleOnRefreshPosts()}
          onEndThreshold={0}
          initialNumToRender={10}
          ListFooterComponent={this._renderFooter}
          onScroll={this._handleOnScroll}
          ListEmptyComponent={this._renderEmptyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={this._handleOnRefreshPosts}
              progressBackgroundColor="#357CE6"
              tintColor={!isDarkTheme ? '#357ce6' : '#96c0ff'}
              titleColor="#fff"
              colors={['#fff']}
            />
          }
          ref={ref => {
            this.flatList = ref;
          }}
        />
      </View>
    );
  }
}

export default withNavigation(injectIntl(PostsView));
