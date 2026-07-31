> * STL六大部件中，除了算法`Algorithm`是以**函数模板**的方式实现的，其余五大部件均由类模板实现
> * **算法`Algorithm`无法直接接触容器，它需要的一切信息必须由容器的`Iterator`提供**

STL 中算法需要的参数主要是`iterator`，一般形式如下所示：

```c++
template <typename Iterator>
Algorithm(Iterator itr1, Iterator itr2) {
    ...
}
template <typename Iterator, typename Cmp>
Algothrim(Iterator itr1, Iterator itr2, Cmp comp) {
    ...
} 
```

* 同一种算法可能会根据传入参数的不同拥有多种版本，类似于函数重载
* 常见的除`iterator`参数之外，许多`Algorithm`支持传入一个**准则（criteria）**，如`sort`算法可以传入比较准则等，这类参数通常是一个仿函数`Functor`

## accumulate

`accumulate`的主要作用是将一定范围内的元素进行累积

```c++
template <typename InputIterator, typename T>
T accumulate(InputIterator first, InputIterator last, T init) {
    for (; first != last; ++first)
        init = init + *first;
    return init;
}
template <typename InputIterator, typename T, typename BinaryOperation>
T accumulate(InputIterator first, InputIterator last, T init, BinaryOperation binary_op) {
    for (; first != last; ++first)
        init = binary_op(init, *first);
    return init;
}
```

* 第二个版本支持传入一个二元操作准则，由`line 10`可知**该准则只需要能够对`()`运算符进行响应即可**

* `binary_op`既可以是一个函数，也可以是一个函数对象（function object），后者还称之为**仿函数Functor**

    ```c++
    int myfunc(int x, int y) { return x + 2 * y; } // 函数
    struct myclass { // 仿函数
        int operator()(int x, int y) { return x + 2 * y; }
    } myobj;
    ```

## for_each

`for_each`的主要作用是对一定范围内的元素做相同的操作，其中的`Function`参数同样可以是函数或仿函数

```c++
template <class InputIterator, class Function>
Function for_each(InputIterator first, InputIterator last, Function f) {
    for ( ; first != last; ++first)
        f(*first);
    return f;
}
```

## replace/replace_if/replace_copy/replace_copy_if

`replace`的主要作用是将一定范围内的旧值替换为新值，`replace_copy`则是边拷贝边替换

```c++
template <class ForwardIterator, class T>
void replace(ForwardIterator first, ForwardIterator last, const T& old_value,
             const T& new_value) {
    for ( ; first != last; ++first)
        if (*first == old_value) *first = new_value;
}

template <class ForwardIterator, class Predicate, class T>
void replace_if(ForwardIterator first, ForwardIterator last, Predicate pred,
                const T& new_value) {
    for ( ; first != last; ++first)
        if (pred(*first)) *first = new_value;
}

template <class InputIterator, class OutputIterator, class T>
OutputIterator replace_copy(InputIterator first, InputIterator last,
                            OutputIterator result, const T& old_value,
                            const T& new_value) {
    for ( ; first != last; ++first, ++result)
        *result = *first == old_value ? new_value : *first;
  return result;
}

template <class Iterator, class OutputIterator, class Predicate, class T>
OutputIterator replace_copy_if(Iterator first, Iterator last,
                               OutputIterator result, Predicate pred,
                               const T& new_value) {
    for ( ; first != last; ++first, ++result)
        *result = pred(*first) ? new_value : *first;
    return result;
}
```

* 可以看出，带`if`后缀的 STL 算法一般需要另外传入一个`pred`参数，**用于判断执行动作的条件是否被满足**

## count/count_if

`count`的主要作用是统计一定范围内等于指定值的元素数量

```c++
template <class InputIterator, class T, class Size>
void count(InputIterator first, InputIterator last, const T& value, Size& n) {
    for ( ; first != last; ++first)
        if (*first == value)
            ++n;
}
template <class InputIterator, class Predicate, class Size>
void count_if(InputIterator first, InputIterator last, Predicate pred, Size& n) {
    for ( ; first != last; ++first)
        if (pred(*first))
            ++n;
}
```

* 循序式容器`array/vector/list/forward_list/deque`不带有成员函数`count()`
* 关联式容器`(multi)set/(multi)map/unordered_(multi)set/unordered_(multi)map`均带有自己的成员函数`count()`

## find/find_if

`find`的主要作用是查找一定范围内等于指定值的**第一个位置**，失败则返回最后一个位置

```c++
template <class InputIterator, class T>
InputIterator find(InputIterator first, InputIterator last, const T& value) {
    while (first != last && *first != value) ++first;
    return first;
}
template <class InputIterator, class Predicate>
InputIterator find_if(InputIterator first, InputIterator last,
                      Predicate pred) {
    while (first != last && !pred(*first)) ++first;
    return first;
}
```

* 循序式容器不带有成员函数`find()`，关联式容器均带有自己的成员函数`find()`

## binary_search

`binary_search`对一定范围内**已排序**的元素执行二分查找，并返回**最低的可插入位置**

```c++
template <class ForwardIterator, class T>
bool binary_search(ForwardIterator first, ForwardIterator last,
                   const T& value) {
    ForwardIterator i = lower_bound(first, last, value);
    return i != last && !(value < *i);
}
template <class ForwardIterator, class T>
inline ForwardIterator lower_bound(ForwardIterator first, ForwardIterator last,
                                   const T& value) {
    return __lower_bound(first, last, value, distance_type(first),
                        iterator_category(first)); // “选择器”
}
template <class ForwardIterator, class T, class Distance>
ForwardIterator __lower_bound(ForwardIterator first, ForwardIterator last, // 内部函数 版本1
                              const T& value, Distance*,
                              forward_iterator_tag) {
    Distance len = 0;
    distance(first, last, len);
    Distance half;
    ForwardIterator middle;

    while (len > 0) {
        half = len >> 1;
        middle = first;
        advance(middle, half);
        if (*middle < value) {
            first = middle;
            ++first;
            len = len - half - 1;
        }
        else
            len = half;
        }
        return first;
}
template <class RandomAccessIterator, class T, class Distance>
RandomAccessIterator __lower_bound(RandomAccessIterator first, // 内部函数 版本2
                                   RandomAccessIterator last, const T& value,
                                   Distance*, random_access_iterator_tag) {
    Distance len = last - first;
    Distance half;
    RandomAccessIterator middle;

    while (len > 0) {
        half = len >> 1;
        middle = first + half;
        if (*middle < value) {
            first = middle + 1;
            len = len - half - 1;
        }
    else
        len = half;
    }
    return first;
}
```

* 可以看到，主要函数`lower_bound`调用的内部函数对不同的迭代器类型做了差分
* 主要区别在于`line 18 vs line 40`以及`line 25 vs 46`，这是因为**只有随机访问的`iterator`才能支持迭代器直接相减或一次跳转多个位置**，否则只能调用`distance`和`advance`函数（详见[[STL 12] | Iterator-2-分类及其对Algorithm的意义](https://past-blog.vercel.app/blog/Iterator-category)）
* 另外，`array/vector/deque`以及关联式容器不带有成员函数`sort()`，而`list/forward_list`带有自己的成员函数`sort()`

*STL 中的算法为普适性而存在，而容器自带的同名方法则会根据容器结构特性进行优化适配，因此优先调用容器自带方法效率会更高*